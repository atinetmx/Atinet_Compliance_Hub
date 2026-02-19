<?php

use function Pest\Laravel\assertDatabaseHas;

test('all helper functions are loaded', function () {
    expect(function_exists('can_use_service'))->toBeTrue();
    expect(function_exists('has_service_limit'))->toBeTrue();
    expect(function_exists('record_service_usage'))->toBeTrue();
    expect(function_exists('get_service_stats'))->toBeTrue();
    expect(function_exists('get_remaining_service_usage'))->toBeTrue();
});

test('can_use_service returns false when not authenticated', function () {
    expect(can_use_service('sat-consulta'))->toBeFalse();
});

test('has_service_limit returns true when not authenticated', function () {
    expect(has_service_limit('sat-consulta'))->toBeTrue();
});

test('record_service_usage returns null when not authenticated', function () {
    expect(record_service_usage('sat-consulta'))->toBeNull();
});

test('get_service_stats returns empty array when not authenticated', function () {
    expect(get_service_stats('sat-consulta'))->toBeArray()->toBeEmpty();
});

test('get_remaining_service_usage returns 0 when not authenticated', function () {
    expect(get_remaining_service_usage('sat-consulta'))->toBe(0);
});
