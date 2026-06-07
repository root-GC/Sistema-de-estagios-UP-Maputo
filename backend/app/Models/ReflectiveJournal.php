<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ============================================================
// app/Models/ReflectiveJournal.php
// ============================================================
class ReflectiveJournal extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = ['internship_id','title','content'];
 
    public function internship() { return $this->belongsTo(Internship::class); }
}