import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserPreferencesDto {
  @ApiPropertyOptional({
    description: 'When true, non-critical notification emails are suppressed.',
  })
  @IsBoolean()
  @IsOptional()
  emailOptOut?: boolean;
}
