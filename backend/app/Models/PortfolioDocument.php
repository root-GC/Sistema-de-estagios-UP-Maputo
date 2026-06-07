<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ============================================================
// app/Models/PortfolioDocument.php
// ============================================================
class PortfolioDocument extends \Illuminate\Database\Eloquent\Model
{
    public $timestamps = false;
    protected $fillable = ['portfolio_id','document_type','file_path','uploaded_at'];
    protected $casts    = ['uploaded_at' => 'datetime'];
 
    public function portfolio() { return $this->belongsTo(Portfolio::class); }
}
 