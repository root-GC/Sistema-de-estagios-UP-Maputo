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
        'coordinator_id',   // ← novo
    ];

    public function department()  { return $this->belongsTo(Department::class); }
    public function students()    { return $this->hasMany(StudentProfile::class); }
    
    // Agora um curso tem um único coordenador
    public function coordinator() { return $this->belongsTo(Coordinator::class); }

    public function getMinYearForInternshipAttribute(): int
    {
        return $this->duration_years === 4 ? 3 : 4;
    }
}