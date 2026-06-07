<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


// ============================================================
// app/Models/CredentialLetter.php
// ============================================================
class CredentialLetter extends \Illuminate\Database\Eloquent\Model
{
    public $timestamps = false;
    protected $fillable = ['internship_id','file_path','generated_by','generated_at'];
    protected $casts    = ['generated_at' => 'datetime'];
 
    public function internship()  { return $this->belongsTo(Internship::class); }
    public function generatedBy() { return $this->belongsTo(User::class, 'generated_by'); }
}