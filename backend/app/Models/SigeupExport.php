<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


// ============================================================
// app/Models/SigeupExport.php
// ============================================================
class SigeupExport extends \Illuminate\Database\Eloquent\Model
{
    public $timestamps = false;
    protected $fillable = ['grade_sheet_id','file_path','exported_by','exported_at'];
    protected $casts    = ['exported_at' => 'datetime'];
 
    public function gradeSheet()  { return $this->belongsTo(InternshipGradeSheet::class); }
    public function exportedBy()  { return $this->belongsTo(User::class, 'exported_by'); }
}