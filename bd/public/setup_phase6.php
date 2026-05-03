<?php

// 1. ADD NAME, NAME2 to AXIOM_PERMS MIGRATION
$files = glob(__DIR__ . '/database/migrations/*_table.php');
foreach ($files as $file) {
    if (str_contains($file, 'jobs') || str_contains($file, 'tokens')) continue;
    $content = file_get_contents($file);

    // If it's axiom_perms table, add name, name2
    if (str_contains($file, 'axiom_perms_table.php')) {
        if (!str_contains($content, "string('name')")) {
            $content = str_replace(
                "\$table->foreignId('user_id')", 
                "\$table->string('name');\n            \$table->string('name2')->nullable();\n            \$table->foreignId('user_id')", 
                $content
            );
        }
    }

    // Add created_by and updated_by to ALL tables
    if (!str_contains($content, 'created_by')) {
        if (str_contains($content, "\$table->timestamps();")) {
            $content = str_replace(
                "\$table->timestamps();", 
                "\$table->unsignedBigInteger('created_by')->nullable();\n            \$table->unsignedBigInteger('updated_by')->nullable();\n            \$table->timestamps();", 
                $content
            );
        }
    }
    file_put_contents($file, $content);
}

// 2. CREATE ObservesUserActions TRAIT AND INJECT TO MODELS
$traitDir = __DIR__ . '/app/Models/Traits';
if (!is_dir($traitDir)) mkdir($traitDir, 0755, true);

$traitContent = <<<'EOT'
<?php

namespace App\Models\Traits;

trait ObservesUserActions
{
    public static function bootObservesUserActions()
    {
        static::creating(function ($model) {
            if (auth()->check()) {
                $model->created_by = auth()->id();
                $model->updated_by = auth()->id();
            }
        });

        static::updating(function ($model) {
            if (auth()->check() && $model->isDirty()) {
                $model->updated_by = auth()->id();
            }
        });
    }
}
EOT;
file_put_contents($traitDir . '/ObservesUserActions.php', $traitContent);

$models = glob(__DIR__ . '/app/Models/*.php');
$tableMap = [
    'Event.php' => 'events',
    'Schedule.php' => 'schedules',
    'Ticket.php' => 'tickets',
    'Checkin.php' => 'checkins',
    'Message.php' => 'messages',
    'SyncQueue.php' => 'sync_queues',
    'User.php' => 'users',
    'AxiomProcess.php' => 'axiom_processes',
    'AxiomPerm.php' => 'axiom_perms',
];

foreach ($models as $modelFile) {
    if (basename($modelFile) === 'Database.php') continue;
    $content = file_get_contents($modelFile);
    $bname = basename($modelFile);
    $t = isset($tableMap[$bname]) ? $tableMap[$bname] : null;
    
    // Inject ObservesUserActions Trait
    if (!str_contains($content, 'ObservesUserActions')) {
        $content = preg_replace('/namespace App\\\\Models;/', "namespace App\\Models;\n\nuse App\\Models\\Traits\\ObservesUserActions;", $content);
        
        if ($t && !str_contains($content, 'protected $table')) {
            // Inject trait AND table
            $content = preg_replace('/class (.*?) extends (.*?)[\r\n]+{/', "class $1 extends $2\n{\n    use ObservesUserActions;\n    protected \$table = '$t';\n", $content);
        } else {
            // Inject trait only
            $content = preg_replace('/class (.*?) extends (.*?)[\r\n]+{/', "class $1 extends $2\n{\n    use ObservesUserActions;\n", $content);
        }
    } else {
        if ($t && !str_contains($content, 'protected $table')) {
            // Inject table ONLY
            $content = preg_replace('/class (.*?) extends (.*?)[\r\n]+{/', "class $1 extends $2\n{\n    protected \$table = '$t';\n", $content);
        }
    }
    
    // UPDATE FILLABLES for AxiomPerm to include name, name2
    if ($bname === 'AxiomPerm.php' && str_contains($content, 'fillable') && !str_contains($content, "'name'")) {
        $content = str_replace("'process_code'", "'process_code', 'name', 'name2'", $content);
    }
    
    file_put_contents($modelFile, $content);
}

echo "Setup Phase 6 Script Complete.\n";
