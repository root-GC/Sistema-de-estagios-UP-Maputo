<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ============================================================
// app/Models/Role.php
// ============================================================
class Role extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = ['name', 'description'];
 
    public function permissions() { return $this->belongsToMany(Permission::class, 'role_permissions'); }
    public function users()       { return $this->belongsToMany(User::class, 'user_roles'); }
}
 