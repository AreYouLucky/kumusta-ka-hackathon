<?php

namespace App\Support;

final class GeoDistance
{
    public static function meters(
        float $originLatitude,
        float $originLongitude,
        float $targetLatitude,
        float $targetLongitude,
    ): float {
        $earthRadiusMeters = 6_371_000;
        $originLatitudeRadians = deg2rad($originLatitude);
        $targetLatitudeRadians = deg2rad($targetLatitude);
        $latitudeDifference = $targetLatitudeRadians - $originLatitudeRadians;
        $longitudeDifference = deg2rad($targetLongitude - $originLongitude);

        $haversine = sin($latitudeDifference / 2) ** 2
            + cos($originLatitudeRadians) * cos($targetLatitudeRadians) * sin($longitudeDifference / 2) ** 2;

        return 2 * $earthRadiusMeters * asin(min(1, sqrt($haversine)));
    }
}
