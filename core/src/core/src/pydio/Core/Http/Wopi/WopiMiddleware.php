<?php
/*
 * Copyright 2007-2015 Abstrium <contact (at) pydio.com>
 * This file is part of Pydio.
 *
 * Pydio is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Pydio is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Pydio.  If not, see <http://www.gnu.org/licenses/>.
 *
 * The latest code can be found at <http://pyd.io/>.
 */
namespace Pydio\Core\Http\Wopi;

use \Psr\Http\Message\ServerRequestInterface;
use \Psr\Http\Message\ResponseInterface;
use Pydio\Access\Core\Model\AJXP_Node;
use Pydio\Access\Core\Model\NodesList;

use Pydio\Core\Http\Message\Message;
use Pydio\Core\Http\Middleware\SapiMiddleware;
use Pydio\Core\Http\Response\SerializableResponseStream;
use Zend\Diactoros\Response\EmptyResponse;
use Zend\Diactoros\Response\SapiEmitter;

defined('AJXP_EXEC') or die('Access not allowed');

/**
 * Class WopiMiddleware
 * Main Middleware for Wopi requests
 * @package Pydio\Core\Http\Middleware
 */
class WopiMiddleware extends SapiMiddleware
{

    /**
     * Output the response to the browser, if no headers were already sent.
     * @param ServerRequestInterface $request
     * @param ResponseInterface $response
     * @return void
     */
    public function emitResponse(ServerRequestInterface $request, ResponseInterface $response) {

        if($response !== false && $response->getBody() && $response->getBody() instanceof SerializableResponseStream){
            /**
             * @var SerializableResponseStream $body;
             */

            $body = &$response->getBody();

            /** @var NodesList $originalData */
            $originalData = $body->getChunks()[0];

            /** @var AJXP_Node $node */
            $node = $originalData->getChildren()[0];

            // We modify the result to have the correct format required by the api
            $x = new SerializableResponseStream();
            $meta = $node->getNodeInfoMeta();
            $userId = $node->getUser()->getId();
            $data = [
                "BaseFileName" => $node->getLabel(),
                "OwnerId"  => $userId,
                "Size"     => $meta["bytesize"],
                "UserId"   => $userId,
                "Version"  => "" . $meta["ajxp_modiftime"]
            ];

            $x->addChunk(new Message($data));
            $response = $response->withBody($x);
            $body = &$response->getBody();

            $params = $request->getParsedBody();
            $forceXML = false;

            if(isSet($params["format"]) && $params["format"] == "xml"){
                $forceXML = true;
            }

            if(($request->hasHeader("Accept") && $request->getHeader("Accept")[0] == "text/xml" ) || $forceXML){
                $body->setSerializer(SerializableResponseStream::SERIALIZER_TYPE_XML);
                $response = $response->withHeader("Content-type", "text/xml; charset=UTF-8");
            } else {
                $body->setSerializer(SerializableResponseStream::SERIALIZER_TYPE_JSON);
                $response = $response->withHeader("Content-type", "application/json; charset=UTF-8");

            }

        }

        if($response !== false && ($response->getBody()->getSize() || $response instanceof EmptyResponse) || $response->getStatusCode() != 200) {
            $emitter = new SapiEmitter();
            $emitter->emit($response);
        }
    }

}