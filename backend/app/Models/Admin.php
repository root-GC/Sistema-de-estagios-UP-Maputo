<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


// ============================================================
// app/Models/Admin.php
// ============================================================
class Admin extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = ['user_id', 'is_root'];
    protected $casts    = ['is_root' => 'boolean'];
 
    public function user() { return $this->belongsTo(User::class); }
}
 