<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

 
// ============================================================
// app/Models/SupervisorProfile.php
// ============================================================
class SupervisorProfile extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = ['user_id', 'department_id', 'academic_rank'];
 
    public function user()        { return $this->belongsTo(User::class); }
    public function department()  { return $this->belongsTo(Department::class); }
    public function internships() { return $this->hasMany(Internship::class, 'supervisor_id'); }
 
    // RF-002: limite de 5 estudantes activos
    public function activeCount(): int
    {
        return $this->internships()->whereIn('status', ['allocated','in_progress'])->count();
    }
 
    public function canAcceptMore(): bool
    {
        return $this->activeCount() < 5;
    }
}