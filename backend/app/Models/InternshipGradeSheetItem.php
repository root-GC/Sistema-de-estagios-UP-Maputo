<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

 
// ============================================================
// app/Models/InternshipGradeSheetItem.php
// ============================================================
class InternshipGradeSheetItem extends \Illuminate\Database\Eloquent\Model
{
    public $timestamps = false;
    protected $fillable = ['grade_sheet_id','internship_result_id'];
 
    public function gradeSheet()       { return $this->belongsTo(InternshipGradeSheet::class); }
    public function internshipResult() { return $this->belongsTo(InternshipResult::class); }
}
 