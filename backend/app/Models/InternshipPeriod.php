<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ============================================================
// app/Models/InternshipPeriod.php
// ============================================================
class InternshipPeriod extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = ['name', 'academic_year', 'start_date', 'end_date'];
    protected $casts    = ['start_date' => 'date', 'end_date' => 'date'];
 
    public function internships() { return $this->hasMany(Internship::class, 'period_id'); }
}
 