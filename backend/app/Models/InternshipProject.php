<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

 
// ============================================================
// app/Models/InternshipProject.php
// ============================================================
class InternshipProject extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = ['internship_id','title','description','file_path','submitted_at'];
    protected $casts    = ['submitted_at' => 'datetime'];
 
    public function internship() { return $this->belongsTo(Internship::class); }
}