<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


// ============================================================
// app/Models/Internship.php  — TABELA CENTRAL
// ============================================================
class Internship extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = [
        'student_id','supervisor_id','tutor_id','institution_id','period_id','status',
    ];
 
    public function student()      { return $this->belongsTo(StudentProfile::class, 'student_id'); }
    public function supervisor()   { return $this->belongsTo(SupervisorProfile::class, 'supervisor_id'); }
    public function tutor()        { return $this->belongsTo(Tutor::class); }
    public function institution()  { return $this->belongsTo(PartnerInstitution::class); }
    public function period()       { return $this->belongsTo(InternshipPeriod::class); }
 
    public function requirement()          { return $this->hasOne(InternshipRequirement::class); }
    public function credentialLetters()    { return $this->hasMany(CredentialLetter::class); }
    public function developmentPlans()     { return $this->hasMany(DevelopmentPlan::class); }
    public function activityPlans()        { return $this->hasMany(ActivityPlan::class); }
    public function reflectiveJournals()   { return $this->hasMany(ReflectiveJournal::class); }
    public function projects()             { return $this->hasMany(InternshipProject::class); }
    public function finalReport()          { return $this->hasOne(FinalReport::class); }
    public function portfolio()            { return $this->hasOne(Portfolio::class); }
    public function tutorEvaluation()      { return $this->hasOne(TutorEvaluation::class); }
    public function supervisorEvaluation() { return $this->hasOne(SupervisorEvaluation::class); }
    public function result()               { return $this->hasOne(InternshipResult::class); }
 
    // RF-010: documentos obrigatórios do portefólio
    const REQUIRED_PORTFOLIO_DOCS = [
        'development_plan', 'activity_plan', 'journal', 'final_report',
    ];
 
    public function missingPortfolioDocs(): array
    {
        if (!$this->portfolio) return self::REQUIRED_PORTFOLIO_DOCS;
 
        $present = $this->portfolio->documents->pluck('document_type')->toArray();
        return array_values(array_diff(self::REQUIRED_PORTFOLIO_DOCS, $present));
    }
 
    public function portfolioIsComplete(): bool
    {
        return empty($this->missingPortfolioDocs());
    }
}