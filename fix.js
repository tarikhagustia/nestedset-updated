const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const TABLE_NAME = "a002_user_structure_v3";
const PARENT_ID_COLUMN = "dpar_id";
const ID_COLUMN = "user_id";

const starTime = new Date().getTime();
const updateBatchSize = 100; // Number of updates to batch
let updates = [];

async function executeBatch() {
  if (updates.length === 0) return;
  await Promise.all(updates);
  updates = [];
}

async function fixTree() {
  try {
    console.log("Fixing the tree, do not close this process...");

    // Update dpar_id to null if user_id equals dpar_id
    await pool.query(
      `UPDATE ${TABLE_NAME} SET ${PARENT_ID_COLUMN} = NULL WHERE ${ID_COLUMN} = ${PARENT_ID_COLUMN}`
    );

    // Fetch all nodes ordered by parent_id
    const { rows: nodes } = await pool.query(
      `SELECT ${ID_COLUMN}, ${PARENT_ID_COLUMN} FROM ${TABLE_NAME} ORDER BY ${PARENT_ID_COLUMN} ASC`
    );

    let lft = 1;

    async function setLeftRightValues(nodeId) {
      // Set the lft value for the current node
      const lftValue = lft++;

      // Get all children of the current node
      const { rows: children } = await pool.query(
        `SELECT ${ID_COLUMN} FROM ${TABLE_NAME} WHERE ${PARENT_ID_COLUMN} = $1 ORDER BY ${ID_COLUMN} ASC`,
        [nodeId]
      );

      // Recursively set lft and rgt values for each child
      for (const child of children) {
        await setLeftRightValues(child[ID_COLUMN]);
      }

      // Set the rgt value for the current node
      const rgtValue = lft++;

      // Batch updates to minimize database round trips
      updates.push(pool.query(
        `UPDATE ${TABLE_NAME} SET "lft" = $1, "rgt" = $2 WHERE ${ID_COLUMN} = $3`,
        [lftValue, rgtValue, nodeId]
      ));

      // Execute batch if the batch size is reached
      if (updates.length >= updateBatchSize) {
        await executeBatch();
      }
    }

    // Start fixing the tree from the root nodes
    for (const node of nodes) {
      if (!node[PARENT_ID_COLUMN]) {
        // Assuming root nodes have parent_id as NULL
        await setLeftRightValues(node[ID_COLUMN]);
      }
    }

    // Execute any remaining updates
    await executeBatch();

    // Restore dpar_id to user_id if dpar_id is null
    await pool.query(
      `UPDATE ${TABLE_NAME} SET ${PARENT_ID_COLUMN} = ${ID_COLUMN} WHERE ${PARENT_ID_COLUMN} IS NULL`
    );

    const endTime = new Date().getTime();
    console.log(`Tree has been fixed in ${endTime - starTime}ms`);
  } catch (err) {
    console.error("Error fixing the tree:", err);
  } finally {
    await pool.end();
  }
}

fixTree();
