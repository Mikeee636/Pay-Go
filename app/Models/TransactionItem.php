<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransactionItem extends Model
{
    protected $fillable = ['transaction_id', 'name', 'qty', 'price'];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}
