<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ============================================================
// app/Models/DevelopmentPlan.php
// ============================================================
class DevelopmentPlan extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = [
        'internship_id','title','file_path','status','supervisor_comment','submitted_at','reviewed_at',
    ];
    protected $casts = ['submitted_at' => 'datetime', 'reviewed_at' => 'datetime'];
 
    public function internship() { return $this->belongsTo(Internship::class); }
}