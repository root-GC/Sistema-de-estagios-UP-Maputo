<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ============================================================
// app/Models/Faculty.php
// ============================================================
class Faculty extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = ['name', 'code'];
 
    public function departments() { return $this->hasMany(Department::class); }
}