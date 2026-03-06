<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    echo "Testing UsageTrends query...\n";

    $months = 7;
    $startDate = now()->subMonths($months)->startOfMonth();

    echo "Start Date: {$startDate->format('Y-m-d')}\n";
    echo "End Date: " . now()->format('Y-m-d') . "\n\n";

    // Test the main query
    $rawTrends = \App\Models\ServiceUsage::selectRaw('
            DATE(consumed_at) as date,
            service_id,
            COUNT(*) as total_requests,
            SUM(quantity) as total_quantity,
            SUM(cost) as total_cost
        ')
        ->where('consumed_at', '>=', $startDate)
        ->groupBy('date', 'service_id')
        ->orderBy('date')
        ->with('service:id,code,name,category')
        ->get();

    echo "Raw trends count: " . $rawTrends->count() . "\n";

    if ($rawTrends->isEmpty()) {
        echo "No usage data found in database!\n";
        echo "Checking if ServiceUsage table has any data...\n";
        $totalUsage = \App\Models\ServiceUsage::count();
        echo "Total ServiceUsage records: {$totalUsage}\n";
    } else {
        echo "First record:\n";
        print_r($rawTrends->first()->toArray());
    }

    // Test services extraction
    $services = $rawTrends->pluck('service')->unique('id')->values()->map(function ($service) {
        return [
            'id' => $service->id,
            'code' => $service->code,
            'name' => $service->name,
            'category' => $service->category,
        ];
    });

    echo "\nServices count: " . $services->count() . "\n";

    echo "\n✅ Query executed successfully!\n";

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " Line: " . $e->getLine() . "\n";
    echo "\nStack trace:\n" . $e->getTraceAsString() . "\n";
}
