<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ============================================================
// app/Models/FinalReport.php
// ============================================================
class FinalReport extends \Illuminate\Database\Eloquent\Model
{
    public $timestamps = false;
    protected $fillable = ['internship_id','file_path','submitted_at'];
    protected $casts    = ['submitted_at' => 'datetime'];
 
    public function internship() { return $this->belongsTo(Internship::class); }
}
 
