<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->string('id')->primary(); // TRX-YYYYMMDD-XXXX string key
            $table->date('date');
            $table->string('time');
            $table->string('cashier');
            $table->integer('subtotal');
            $table->integer('tax');
            $table->integer('total');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
