<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ============================================================
// app/Models/Tutor.php
// ============================================================
class Tutor extends Model
{
    protected $fillable = [
        'user_id',
        'institution_id',
        'name',
        'email',
        'phone',
        'position',
        'access_token',
    ];

    protected $hidden = ['access_token'];

    public function user()         { return $this->belongsTo(User::class); }
    public function institution()  { return $this->belongsTo(PartnerInstitution::class); }
    public function internships()  { return $this->hasMany(Internship::class); }
    public function evaluations()  { return $this->hasMany(TutorEvaluation::class); }
}