<?php

namespace App\Models;

use App\Models\Traits\ObservesUserActions;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AxiomProcess extends Model
{
    use ObservesUserActions;
    protected $table = 'axiom_processes';

    use HasFactory;

    protected $fillable = ['process_code', 'name', 'name2', 'controller', 'statusid'];
}
