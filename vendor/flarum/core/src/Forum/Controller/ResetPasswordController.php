<?php
/*
 * This file is part of Flarum.
 *
 * (c) Toby Zerner <toby.zerner@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Flarum\Forum\Controller;

use Flarum\Core\PasswordToken;
use Flarum\Http\Controller\AbstractHtmlController;
use Flarum\Core\Exception\InvalidConfirmationTokenException;
use Psr\Http\Message\ServerRequestInterface as Request;
use Illuminate\Contracts\View\Factory;
use DateTime;

class ResetPasswordController extends AbstractHtmlController
{
    /**
     * @var Factory
     */
    protected $view;

    /**
     * @param Factory $view
     */
    public function __construct(Factory $view)
    {
        $this->view = $view;
    }

    /**
     * @param Request $request
     * @return \Illuminate\Contracts\View\View
     * @throws InvalidConfirmationTokenException
     */
    public function render(Request $request)
    {
        $token = array_get($request->getQueryParams(), 'token');

        $token = PasswordToken::findOrFail($token);

        if ($token->created_at < new DateTime('-1 day')) {
            throw new InvalidConfirmationTokenException;
        }

        return $this->view->make('flarum::reset')->with('token', $token->id);
    }
}
