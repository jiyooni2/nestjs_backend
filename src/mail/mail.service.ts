import { Inject, Injectable } from '@nestjs/common';
import { EmailVar, MailModuleOptions } from './mail.interfaces';
import { CONFIG_OPTIONS } from './../common/common.constants';
import * as FormData from 'form-data';
import got from 'got';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  private async sendEmail(
    subject: string,
    template: string,
    emailVars: EmailVar[],
  ) {
    const form = new FormData();
    form.append('from', `mailgun@${this.options.domain}`);

    //mailgun에 카드 등록한 다음에 to 바꿔야함
    form.append('to', 'kjy2390@naver.com');
    form.append('subject', subject);
    form.append('template', template);
    emailVars.forEach((eVar) => form.append(`v:${eVar.key}`, eVar.value));

    try {
      await got(`https://api.mailgun.net/v3/${this.options.domain}/messages`, {
        headers: {
          Authorization: `basic ${Buffer.from(
            `spi:${this.options.apiKey}`,
          ).toString('base64')}`,
        },
        body: form,
        method: 'POST',
      });
    } catch (error) {
      console.error(error);
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify your email', 'email_auth', [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }
}
