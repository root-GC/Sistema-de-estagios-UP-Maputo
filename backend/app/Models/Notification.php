<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ============================================================
// app/Models/Notification.php
// ============================================================
class Notification extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = ['user_id','title','message','is_read'];
    protected $casts    = ['is_read' => 'boolean'];
 
    public function user() { return $this->belongsTo(User::class); }
}