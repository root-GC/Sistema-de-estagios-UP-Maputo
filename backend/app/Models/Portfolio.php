<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ============================================================
// app/Models/Portfolio.php
// ============================================================
class Portfolio extends \Illuminate\Database\Eloquent\Model
{
    public $timestamps = false;
    protected $fillable = ['internship_id','status','submitted_at'];
    protected $casts    = ['submitted_at' => 'datetime'];
 
    public function internship() { return $this->belongsTo(Internship::class); }
    public function documents()  { return $this->hasMany(PortfolioDocument::class); }
}
