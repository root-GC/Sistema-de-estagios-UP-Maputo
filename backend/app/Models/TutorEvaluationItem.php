<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ============================================================
// app/Models/TutorEvaluationItem.php
// ============================================================
class TutorEvaluationItem extends \Illuminate\Database\Eloquent\Model
{
    public $timestamps = false;
    protected $fillable = ['evaluation_id','criteria','score'];
 
    public function evaluation() { return $this->belongsTo(TutorEvaluation::class); }
}
 