<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ============================================================
// app/Models/Permission.php
// ============================================================
class Permission extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = ['name', 'description'];
 
    public function roles() { return $this->belongsToMany(Role::class, 'role_permissions'); }
}