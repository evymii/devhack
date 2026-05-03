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