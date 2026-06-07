<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ============================================================
// app/Models/InternshipRequirement.php
// ============================================================
class InternshipRequirement extends \Illuminate\Database\Eloquent\Model
{
    public $timestamps = false;
    protected $fillable = ['internship_id','requirements_met','observations','verified_by','verified_at'];
    protected $casts    = ['requirements_met' => 'boolean', 'verified_at' => 'datetime'];
 
    public function internship() { return $this->belongsTo(Internship::class); }
    public function verifier()   { return $this->belongsTo(User::class, 'verified_by'); }
}