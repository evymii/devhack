<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds columns required by the frontend Ticket type:
 *
 * Ticket {
 *   id, eventId, eventTitle, eventDate, venue,
 *   tierName, pricePaid,
 *   buyer { fullName, email, phone, dateOfBirth, nationalId },
 *   biometric { snapshot, enrolledAt },
 *   status: "valid" | "redeemed",
 *   createdAt, redeemedAt?
 * }
 */
return new class extends Migration {
      public function up(): void
      {
            Schema::table('tickets', function (Blueprint $table) {
                  $table->string('tier_name')->nullable()->after('type')
                        ->comment('Frontend tierName — e.g. VIP, General Admission');
                  $table->unsignedInteger('price_paid')->default(0)->after('tier_name')
                        ->comment('Price paid in dollars (whole number, matches frontend pricePaid)');

                  $table->string('buyer_name')->nullable()->after('price_paid')
                        ->comment('buyer.fullName');
                  $table->string('buyer_email')->nullable()->after('buyer_name')
                        ->comment('buyer.email');
                  $table->string('buyer_phone', 20)->nullable()->after('buyer_email')
                        ->comment('buyer.phone');
                  $table->date('buyer_dob')->nullable()->after('buyer_phone')
                        ->comment('buyer.dateOfBirth');
                  $table->string('buyer_national_id', 20)->nullable()->after('buyer_dob')
                        ->comment('buyer.nationalId — Монгол иргэний үнэмлэхний дугаар');


                  $table->longText('biometric_snapshot')->nullable()->after('face_embedding')
                        ->comment('biometric.snapshot — base64 face photo (data-uri)');
                  $table->timestamp('biometric_enrolled_at')->nullable()->after('biometric_snapshot')
                        ->comment('biometric.enrolledAt');

                  $table->timestamp('redeemed_at')->nullable()->after('is_used')
                        ->comment('Timestamp when ticket was redeemed (status = redeemed)');
            });
      }

      public function down(): void
      {
            Schema::table('tickets', function (Blueprint $table) {
                  $table->dropColumn([
                        'tier_name',
                        'price_paid',
                        'buyer_name',
                        'buyer_email',
                        'buyer_phone',
                        'buyer_dob',
                        'buyer_national_id',
                        'biometric_snapshot',
                        'biometric_enrolled_at',
                        'redeemed_at',
                  ]);
            });
      }
};
