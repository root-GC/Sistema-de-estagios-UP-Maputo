<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ============================================================
// app/Models/SupervisorEvaluation.php
// ============================================================
class SupervisorEvaluation extends \Illuminate\Database\Eloquent\Model
{
    public $timestamps = false;
    protected $fillable = ['internship_id','score','observations','submitted_at'];
    protected $casts    = ['submitted_at' => 'datetime'];
 
    public function internship() { return $this->belongsTo(Internship::class); }
}