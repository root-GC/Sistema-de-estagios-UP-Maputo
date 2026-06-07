<?php
// ============================================================
// app/Models/User.php
// ============================================================
namespace App\Models;
 
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;   // <-- importa a trait
use App\Notifications\ResetPasswordNotification; 
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable; 
 
    protected $fillable = ['name', 'email', 'password', 'status'];
    protected $hidden   = ['password', 'remember_token'];
    protected $casts    = ['password' => 'hashed'];
 
    public function roles()           { return $this->belongsToMany(Role::class, 'user_roles'); }
    public function admin()           { return $this->hasOne(Admin::class); }
    public function studentProfile()  { return $this->hasOne(StudentProfile::class); }
    public function supervisorProfile(){ return $this->hasOne(SupervisorProfile::class); }
    public function coordinator()     { return $this->hasOne(Coordinator::class); }
    public function departmentHead()  { return $this->hasOne(DepartmentHead::class); }
    public function notifications()   { return $this->hasMany(Notification::class); }
    public function auditLogs()       { return $this->hasMany(AuditLog::class); }
 
    public function hasRole(string ...$roles): bool
    {
        return $this->roles->whereIn('name', $roles)->isNotEmpty();
    }
 
    public function hasPermission(string $permission): bool
    {
        return $this->roles->flatMap->permissions->contains('name', $permission);
    }
        /**
     * Envia a notificação de redefinição de palavra‑passe.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}