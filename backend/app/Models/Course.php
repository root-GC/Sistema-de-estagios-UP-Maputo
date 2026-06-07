<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

 
// ============================================================
// app/Models/Course.php
// ============================================================
class Course extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = [
        'department_id','name','code','duration_years',
        'weight_contact_hours','weight_independent_study',
    ];
 
    public function department()   { return $this->belongsTo(Department::class); }
    public function students()     { return $this->hasMany(StudentProfile::class); }
    public function coordinators() { return $this->hasMany(Coordinator::class); }
 
    // RF-004: mínimo de anos concluídos para admissão ao estágio
    public function getMinYearForInternshipAttribute(): int
    {
        return $this->duration_years === 4 ? 3 : 4;
    }
}