<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

 
// ============================================================
// app/Models/InternshipResult.php
// ============================================================
class InternshipResult extends \Illuminate\Database\Eloquent\Model
{
    public $timestamps = false;
    protected $fillable = [
        'internship_id','tutor_score','supervisor_score','final_score','approved','calculated_at',
    ];
    protected $casts = ['approved' => 'boolean', 'calculated_at' => 'datetime'];
 
    public function internship() { return $this->belongsTo(Internship::class); }
}