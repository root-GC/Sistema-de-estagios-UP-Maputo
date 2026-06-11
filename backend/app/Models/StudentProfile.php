<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

 
// ============================================================
// app/Models/StudentProfile.php
// ============================================================
class StudentProfile extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = [
    'user_id', 'course_id', 'student_number', 'current_year',
    'bi_numero', 'bi_data_emissao', 'pai_nome', 'mae_nome',
];
 
    public function user()        { return $this->belongsTo(User::class); }
    public function course()      { return $this->belongsTo(Course::class); }
    public function internships() { return $this->hasMany(Internship::class, 'student_id'); }
 
    // RF-004
    public function meetsInternshipRequirements(): bool
    {
        return $this->current_year > $this->course->min_year_for_internship;
    }
}