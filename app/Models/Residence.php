<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Residence extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by',
        'resident_code',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'birthdate',
        'sex',
        'is_pwd',
        'is_pregnant',
        'pregnancy_month',
        'household_number',
        'contact_number',
        'province',
        'city',
        'barangay',
        'purok',
        'street',
        'address_line',
        'latitude',
        'longitude',
        'structure_type',
        'has_health_problem',
        'health_problem_details',
        'notes',
    ];

    protected $casts = [
        'birthdate' => 'date',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'is_pwd' => 'boolean',
        'is_pregnant' => 'boolean',
        'pregnancy_month' => 'integer',
        'has_health_problem' => 'boolean',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
