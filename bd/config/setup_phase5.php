<?php

// 1. ADD NAME, NAME2 to AXIOM_PERMS MIGRATION
$files = glob(__DIR__ . '/database/migrations/*_table.php');
foreach ($files as $file) {
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
        // Inject right before timestamps
        $content = str_replace(
            "\$table->timestamps();", 
            "\$table->unsignedBigInteger('created_by')->nullable();\n            \$table->unsignedBigInteger('updated_by')->nullable();\n            \$table->timestamps();", 
            $content
        );
        file_put_contents($file, $content);
        echo "Updated schema for: " . basename($file) . "\n";
    }
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
foreach ($models as $modelFile) {
    if (basename($modelFile) === 'Database.php') continue;
    $content = file_get_contents($modelFile);
    if (!str_contains($content, 'ObservesUserActions')) {
        $content = preg_replace('/namespace App\\\\Models;/', "namespace App\\Models;\n\nuse App\\Models\\Traits\\ObservesUserActions;", $content);
        $content = preg_replace('/class (.*?) extends (.*?)[\r\n]+{/', "class $1 extends $2\n{\n    use ObservesUserActions;", $content);
        file_put_contents($modelFile, $content);
        echo "Injected ObservesUserActions into " . basename($modelFile) . "\n";
    }
}

// UPDATE FILLABLES for AxiomPerm to include name, name2
$permModel = __DIR__ . '/app/Models/AxiomPerm.php';
$pC = file_get_contents($permModel);
if (str_contains($pC, 'fillable') && !str_contains($pC, "'name'")) {
    $pC = str_replace("'process_code'", "'process_code', 'name', 'name2'", $pC);
    file_put_contents($permModel, $pC);
}

echo "Setup Phase 5 Script Complete.\n";
