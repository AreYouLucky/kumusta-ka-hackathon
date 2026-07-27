<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AffectedResident extends Model
{
    use HasFactory;

    protected $fillable = [
        'disaster_incident_id',
        'residence_id',
        'created_by',
        'household_number',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'birthdate',
        'sex',
        'contact_number',
        'province',
        'city',
        'barangay',
        'address_line',
        'evacuation_center',
        'status',
        'resident_status',
        'medical_notes',
    ];

    protected $casts = [
        'birthdate' => 'date',
        'resident_status' => 'integer',
    ];

    public function incident(): BelongsTo
    {
        return $this->belongsTo(DisasterIncident::class, 'disaster_incident_id');
    }

    public function residence(): BelongsTo
    {
        return $this->belongsTo(Residence::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
