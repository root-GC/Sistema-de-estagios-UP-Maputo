<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

 
// ============================================================
// app/Models/InternshipGradeSheet.php
// ============================================================
class InternshipGradeSheet extends \Illuminate\Database\Eloquent\Model
{
    public $timestamps = false;
    protected $fillable = ['course_id','period_id','generated_by','generated_at'];
    protected $casts    = ['generated_at' => 'datetime'];
 
    public function course()      { return $this->belongsTo(Course::class); }
    public function period()      { return $this->belongsTo(InternshipPeriod::class); }
    public function generatedBy() { return $this->belongsTo(User::class, 'generated_by'); }
    public function items()       { return $this->hasMany(InternshipGradeSheetItem::class, 'grade_sheet_id'); }
    public function exports()     { return $this->hasMany(SigeupExport::class, 'grade_sheet_id'); }
}
 