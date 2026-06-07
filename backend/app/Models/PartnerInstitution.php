<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ============================================================
// app/Models/PartnerInstitution.php
// ============================================================
class PartnerInstitution extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = ['name', 'address', 'phone', 'email'];
 
    public function tutors()      { return $this->hasMany(Tutor::class, 'institution_id'); }
    public function internships() { return $this->hasMany(Internship::class, 'institution_id'); }
}