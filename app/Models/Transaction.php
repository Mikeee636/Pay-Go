<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'date', 'time', 'cashier', 'subtotal', 'tax', 'total'];

    public function items()
    {
        return $this->hasMany(TransactionItem::class);
    }
}
