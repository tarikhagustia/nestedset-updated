const { Pool } = require("pg");
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// const TABLE_NAME = "users";
// const PARENT_ID_COLUMN = "parent_id";
// const ID_COLUMN = "id";

const TABLE_NAME = "a002_user_structure_v3";
const PARENT_ID_COLUMN = "dpar_id";
const ID_COLUMN = "user_id";

async function fixTree() {
    try {
        // Fetch all nodes ordered by ${PARENT_ID_COLUMN}
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

            // Update the node with the lft and rgt values
            await pool.query(
                `UPDATE ${TABLE_NAME} SET "lft" = $1, "rgt" = $2 WHERE ${ID_COLUMN} = $3`,
                [lftValue, rgtValue, nodeId]
            );
        }

        // Start fixing the tree from the root nodes
        for (const node of nodes) {
            if (!node[PARENT_ID_COLUMN]) {
                // Assuming root nodes have ${PARENT_ID_COLUMN} as NULL
                await setLeftRightValues(node[ID_COLUMN]);
            }
        }

        console.log("Tree has been fixed.");
    } catch (err) {
        console.error("Error fixing the tree:", err);
    } finally {
        await pool.end();
    }
}

fixTree();
