<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ============================================================
// app/Models/Coordinator.php
// ============================================================
class Coordinator extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = ['user_id', 'course_id'];
 
    public function user()   { return $this->belongsTo(User::class); }
    public function course() { return $this->belongsTo(Course::class); }
}