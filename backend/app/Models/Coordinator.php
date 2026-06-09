<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ============================================================
// app/Models/Coordinator.php
// ============================================================
class Coordinator extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = ['user_id'];   // sem course_id

    public function user()    { return $this->belongsTo(User::class); }
    
    // Um coordenador tem vários cursos
    public function courses() { return $this->hasMany(Course::class); }
}