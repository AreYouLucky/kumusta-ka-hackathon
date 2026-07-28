<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'egov_subject',
        'username',
        'fname',
        'lname',
        'mname',
        'suffix',
        'sex',
        'role',
        'email',
        'email_verified_at',
        'mobile_number',
        'password',
        'last_login',
        'egov_profile',
        'egov_profile_synced_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'egov_profile',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login' => 'datetime',
            'password' => 'hashed',
            'egov_profile' => 'array',
            'egov_profile_synced_at' => 'datetime',
        ];
    }

    public function dashboardRoute(): string
    {
        return match (strtolower($this->role)) {
            'administrator' => 'admin.dashboard',
            'gcc' => 'gcc.dashboard.index',
            'encoder' => 'encoder.dashboard',
            'publisher' => 'publisher.dashboard',
            'external-encoder' => 'external-encoder.dashboard',
            'citizen' => 'citizen.home',
            'responder' => 'responder.index',
            default => 'home',
        };
    }

    public function ownedSafetyCircles(): HasMany
    {
        return $this->hasMany(SafetyCircle::class, 'owner_id');
    }

    public function safetyCircleMemberships(): HasMany
    {
        return $this->hasMany(SafetyCircleMember::class);
    }
}
