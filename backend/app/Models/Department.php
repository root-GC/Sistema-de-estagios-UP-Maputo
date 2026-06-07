<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ============================================================
// app/Models/Department.php
// ============================================================
class Department extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = ['faculty_id', 'name', 'code'];
 
    public function faculty()         { return $this->belongsTo(Faculty::class); }
    public function courses()         { return $this->hasMany(Course::class); }
    public function supervisors()     { return $this->hasMany(SupervisorProfile::class); }
    public function departmentHeads() { return $this->hasMany(DepartmentHead::class); }
}