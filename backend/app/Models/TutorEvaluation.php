<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


// ============================================================
// app/Models/TutorEvaluation.php
// ============================================================
class TutorEvaluation extends \Illuminate\Database\Eloquent\Model
{
    public $timestamps = false;
    protected $fillable = ['internship_id','tutor_id','score','observations','submitted_at'];
    protected $casts    = ['submitted_at' => 'datetime'];
 
    public function internship() { return $this->belongsTo(Internship::class); }
    public function tutor()      { return $this->belongsTo(Tutor::class); }
    public function items()      { return $this->hasMany(TutorEvaluationItem::class, 'evaluation_id'); }
}