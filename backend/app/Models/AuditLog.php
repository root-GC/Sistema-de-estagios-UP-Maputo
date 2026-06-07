<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


// ============================================================
// app/Models/AuditLog.php
// ============================================================
class AuditLog extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = ['user_id','action','entity_type','entity_id','description','ip_address'];
 
    public function user() { return $this->belongsTo(User::class); }
 
    public static function record(string $action, string $entity, int $entityId, string $desc, ?int $userId = null): void
    {
        static::create([
            'user_id'     => $userId ?? auth()->id(),
            'action'      => $action,
            'entity_type' => $entity,
            'entity_id'   => $entityId,
            'description' => $desc,
            'ip_address'  => request()->ip(),
        ]);
    }
}