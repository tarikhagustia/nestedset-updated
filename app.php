<?php
require "vendor/autoload.php";

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Kalnoy\Nestedset\NodeTrait;
use Illuminate\Database\Capsule\Manager as Capsule;

// Load .env file
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

class Tree extends Model
{
    use HasFactory;
    use NodeTrait;

    protected $table = 'a002_user_structure_v2';
    protected $primaryKey = 'user_id';

    public $timestamps = false;
    public $incrementing = false;

    public function getLftName()
    {
        return 'left';
    }

    public function getRgtName()
    {
        return 'right';
    }

    public function getParentIdName()
    {
        return 'dpar_id';
    }

    // Specify parent id attribute mutator
    public function setParentAttribute($value)
    {
        $this->setParentIdAttribute($value);
    }
}

$capsule = new Capsule;
$capsule->addConnection([
    "driver" => "pgsql",
    "host" => $_ENV["DB_HOST"],
    "port" => $_ENV["DB_PORT"],
    "database" => $_ENV["DB_DATABASE"],
    "username" => $_ENV["DB_USERNAME"],
    "password" => $_ENV["DB_PASSWORD"]
]);
$capsule->setAsGlobal();
$capsule->bootEloquent();

// Connect to the database
try {
    echo "Trying to connect to the database..." . PHP_EOL;
    $capsule->getConnection()->getPdo();
    echo "Connected to the database successfully." . PHP_EOL;
    echo "Trying to fix the tree..." . PHP_EOL;
    $fixed = Tree::fixTree();
    echo "Fixed total " . (string) $fixed . " data successfully" . PHP_EOL;
} catch (\Exception $e) {
    die("Failed ... " . $e);
}